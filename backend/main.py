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


class QuestionGenerateIn(BaseModel):
    kind: str = "aptitude"
    category: str = "All"
    level: str = "Beginner"
    count: int = 5


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


@app.post("/ai/questions")
async def ai_questions(payload: QuestionGenerateIn, current_user: Annotated[UserOut, Depends(get_current_user)]):
    level = payload.level if payload.level in {"Beginner", "Medium", "High"} else "Beginner"
    if payload.kind == "coding":
        coding_fallback = {
            "Beginner": [
                {"title": "Count Vowels", "difficulty": "Beginner", "desc": "Count vowels in a given string.", "example": 'Input: "placement"\nOutput: 3', "starterPython": "def count_vowels(s):\n    pass\n\nprint(count_vowels('placement'))", "solution": "def count_vowels(s):\n    return sum(1 for ch in s.lower() if ch in 'aeiou')"},
                {"title": "Find Maximum", "difficulty": "Beginner", "desc": "Find the maximum number in a list.", "example": "Input: [4,8,2]\nOutput: 8", "starterPython": "def find_max(nums):\n    pass\n\nprint(find_max([4,8,2]))", "solution": "def find_max(nums):\n    return max(nums)"},
                {"title": "Sum of Array", "difficulty": "Beginner", "desc": "Return the sum of all numbers in an array.", "example": "Input: [1,2,3]\nOutput: 6", "starterPython": "def array_sum(nums):\n    pass\n\nprint(array_sum([1,2,3]))", "solution": "def array_sum(nums):\n    return sum(nums)"},
            ],
            "Medium": [
                {"title": "Remove Duplicates", "difficulty": "Medium", "desc": "Return unique values while preserving order.", "example": "Input: [1,2,1,3]\nOutput: [1,2,3]", "starterPython": "def unique_values(nums):\n    pass\n\nprint(unique_values([1,2,1,3]))", "solution": "def unique_values(nums):\n    seen=set(); ans=[]\n    for n in nums:\n        if n not in seen:\n            seen.add(n); ans.append(n)\n    return ans"},
                {"title": "Two Sum", "difficulty": "Medium", "desc": "Return indices of two numbers that add to target.", "example": "Input: nums=[2,7,11,15], target=9\nOutput: [0,1]", "starterPython": "def two_sum(nums, target):\n    pass\n\nprint(two_sum([2,7,11,15], 9))", "solution": "def two_sum(nums, target):\n    seen={}\n    for i,n in enumerate(nums):\n        if target-n in seen: return [seen[target-n], i]\n        seen[n]=i"},
                {"title": "Valid Anagram", "difficulty": "Medium", "desc": "Check whether two strings are anagrams.", "example": 'Input: "listen", "silent"\nOutput: True', "starterPython": "def is_anagram(a, b):\n    pass\n\nprint(is_anagram('listen', 'silent'))", "solution": "def is_anagram(a,b):\n    return sorted(a) == sorted(b)"},
            ],
            "High": [
                {"title": "Longest Unique Substring", "difficulty": "High", "desc": "Return length of longest substring without repeating characters.", "example": 'Input: "abcabcbb"\nOutput: 3', "starterPython": "def longest_unique_substring(s):\n    pass\n\nprint(longest_unique_substring('abcabcbb'))", "solution": "def longest_unique_substring(s):\n    left=0; seen={}; best=0\n    for right,ch in enumerate(s):\n        if ch in seen and seen[ch] >= left: left = seen[ch] + 1\n        seen[ch]=right; best=max(best,right-left+1)\n    return best"},
                {"title": "Minimum Coins", "difficulty": "High", "desc": "Return minimum coins needed for an amount.", "example": "Input: coins=[1,2,5], amount=11\nOutput: 3", "starterPython": "def min_coins(coins, amount):\n    pass\n\nprint(min_coins([1,2,5], 11))", "solution": "def min_coins(coins, amount):\n    dp=[amount+1]*(amount+1); dp[0]=0\n    for x in range(1,amount+1):\n        for c in coins:\n            if c <= x: dp[x]=min(dp[x],dp[x-c]+1)\n    return dp[amount] if dp[amount] <= amount else -1"},
                {"title": "Merge Intervals", "difficulty": "High", "desc": "Merge all overlapping intervals.", "example": "Input: [[1,3],[2,6],[8,10]]\nOutput: [[1,6],[8,10]]", "starterPython": "def merge_intervals(intervals):\n    pass\n\nprint(merge_intervals([[1,3],[2,6],[8,10]]))", "solution": "def merge_intervals(intervals):\n    intervals.sort(); ans=[]\n    for s,e in intervals:\n        if not ans or s > ans[-1][1]: ans.append([s,e])\n        else: ans[-1][1]=max(ans[-1][1], e)\n    return ans"},
            ],
        }
        fallback = {
            "items": coding_fallback[level][: payload.count]
        }
        prompt = f"Generate {payload.count} {level} placement coding problems as JSON items with title,difficulty,desc,example,starterPython,solution."
    else:
        aptitude_fallback = [
            {"q": "A train covers 120 km in 2 hours. What is its speed?", "opts": ["40", "50", "60", "70"], "ans": 2, "cat": "Quantitative", "level": level},
            {"q": "Choose the odd one: 3, 6, 11, 18, 27, 38", "opts": ["11", "18", "27", "38"], "ans": 3, "cat": "Logical", "level": level},
            {"q": "Choose the synonym of 'BRIEF'.", "opts": ["Short", "Heavy", "Late", "Wide"], "ans": 0, "cat": "Verbal", "level": level},
            {"q": "If x + 1/x = 5, find x^2 + 1/x^2.", "opts": ["21", "23", "25", "27"], "ans": 1, "cat": "Quantitative", "level": level},
            {"q": "Statement: All coders are learners. Which definitely follows?", "opts": ["Some learners are coders", "All learners are coders", "No coder learns", "Some coders are analysts"], "ans": 0, "cat": "Logical", "level": level},
        ]
        if payload.category != "All":
            aptitude_fallback = [item for item in aptitude_fallback if item["cat"] == payload.category] or aptitude_fallback
        fallback = {
            "items": aptitude_fallback[: payload.count]
        }
        prompt = f"Generate {payload.count} {level} {payload.category} aptitude MCQs as JSON items with q, opts array of 4, ans index, cat, level."
    text = await ai_text(prompt, "")
    return {"raw": text, **fallback}
