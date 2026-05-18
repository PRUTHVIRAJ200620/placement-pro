from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

SECRET_KEY = "change-this-secret-before-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI(title="PlacePrep API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

users_db = {}


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


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


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
