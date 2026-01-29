from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import BaseModel, constr
from passlib.context import CryptContext
from ..database import get_db
from .. import models

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRegister(BaseModel):
    username: constr(min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    password: constr(min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

@router.get("/me")
def get_current_user(db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated"
    )

@router.post("/logout")
def logout():
    return {"message": "Logout successful"}

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(models.User).filter(
            models.User.username == user_data.username
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )

        hashed_pw = hash_password(user_data.password)
        
        new_user = models.User(
            username=user_data.username,
            password_hash=hashed_pw
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "id": new_user.id,
            "username": new_user.username,
            "message": "User created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == user_data.username
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "id": user.id,
        "username": user.username
    }
