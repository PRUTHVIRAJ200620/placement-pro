import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-before-production")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-mini")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI(title="PlacePrep API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

users_db = {}
results_db = {}
resume_db = {}


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    name: str
    email: EmailStr
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ResultIn(BaseModel):
    module: str
    score: int
    total: int
    details: dict = {}


class ResumeIn(BaseModel):
    name: str
    email: str
    phone: str
    college: str
    degree: str
    cgpa: str
    skills: str
    projects: str
    internship: str
    achievements: str
    summary: str = ""
    portfolio: str = ""


class InterviewFeedbackIn(BaseModel):
    question: str
    answer: str


class CodeReviewIn(BaseModel):
    problem: str
    language: str
    code: str


class ResumeReviewIn(BaseModel):
    resume: ResumeIn


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def fallback_feedback(kind: str, text: str) -> str:
    if kind == "interview":
        if len(text.split()) < 20:
            return "Your answer is a good start, but it is too short. Add Situation, Task, Action, and Result, then include one measurable outcome."
        return "Good structure. Improve it by adding a specific metric, your personal contribution, and a clear closing sentence."
    if kind == "code":
        if "pass" in text:
            return "The function is incomplete. Replace pass with logic, add edge-case handling, and include at least one sample test."
        return "Code submitted. Review time complexity, variable names, and edge cases such as empty input or very small input."
    return "Your resume has the right sections. Strengthen it by adding quantified impact, action verbs, ATS keywords, and clearer project outcomes."


async def ai_text(prompt: str, fallback: str) -> str:
    if not OPENAI_API_KEY:
        return fallback
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_MODEL,
                    "input": prompt,
                    "max_output_tokens": 250,
                },
            )
        response.raise_for_status()
        data = response.json()
        return data.get("output_text") or fallback
    except Exception:
        return fallback


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserOut:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = users_db.get(email)
    if not user:
        raise credentials_exception
    return UserOut(name=user["name"], email=user["email"], role=user["role"])


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/register", response_model=TokenResponse)
def register(payload: RegisterRequest):
    email = payload.email.lower()
    if email in users_db:
        raise HTTPException(status_code=409, detail="Email already registered")

    users_db[email] = {
        "name": payload.name,
        "email": email,
        "role": payload.role,
        "hashed_password": get_password_hash(payload.password),
    }
    token = create_access_token({"sub": email, "role": payload.role})
    return {"access_token": token, "user": users_db[email]}


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    email = payload.email.lower()
    user = users_db.get(email)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": email, "role": user["role"]})
    return {"access_token": token, "user": user}


@app.get("/me", response_model=UserOut)
def me(current_user: Annotated[UserOut, Depends(get_current_user)]):
    return current_user


@app.get("/ai/suggestions")
def ai_suggestions(current_user: Annotated[UserOut, Depends(get_current_user)]):
    return {
        "items": [
            "AI mock interviewer with answer feedback",
            "AI resume analyzer for ATS and keyword gaps",
            "AI coding reviewer for logic and complexity feedback",
            "Adaptive aptitude difficulty based on scores",
            "Weak-area prediction from test history",
        ]
    }


@app.post("/results")
def save_result(payload: ResultIn, current_user: Annotated[UserOut, Depends(get_current_user)]):
    item = payload.model_dump()
    item["date"] = datetime.now(timezone.utc).isoformat()
    results_db.setdefault(current_user.email, []).append(item)
    return {"saved": True, "result": item}


@app.get("/results/me")
def my_results(current_user: Annotated[UserOut, Depends(get_current_user)]):
    return {"items": results_db.get(current_user.email, [])}


@app.post("/resume")
def save_resume(payload: ResumeIn, current_user: Annotated[UserOut, Depends(get_current_user)]):
    resume_db[current_user.email] = payload.model_dump()
    return {"saved": True, "resume": resume_db[current_user.email]}


@app.get("/resume/me")
def my_resume(current_user: Annotated[UserOut, Depends(get_current_user)]):
    return {"resume": resume_db.get(current_user.email)}


@app.post("/ai/interview-feedback")
async def interview_feedback(payload: InterviewFeedbackIn, current_user: Annotated[UserOut, Depends(get_current_user)]):
    fallback = fallback_feedback("interview", payload.answer)
    prompt = f"Give concise campus placement interview feedback.\nQuestion: {payload.question}\nAnswer: {payload.answer}\nReturn 3 practical improvements."
    return {"feedback": await ai_text(prompt, fallback)}


@app.post("/ai/code-review")
async def code_review(payload: CodeReviewIn, current_user: Annotated[UserOut, Depends(get_current_user)]):
    fallback = fallback_feedback("code", payload.code)
    prompt = f"Review this {payload.language} solution for a placement coding problem.\nProblem: {payload.problem}\nCode:\n{payload.code}\nGive concise feedback on correctness, complexity, and edge cases."
    return {"feedback": await ai_text(prompt, fallback)}


@app.post("/ai/resume-review")
async def resume_review(payload: ResumeReviewIn, current_user: Annotated[UserOut, Depends(get_current_user)]):
    resume = payload.resume.model_dump()
    fallback = fallback_feedback("resume", str(resume))
    prompt = f"Review this student placement resume. Give concise ATS, keyword, and project-impact feedback:\n{resume}"
    return {"feedback": await ai_text(prompt, fallback)}
