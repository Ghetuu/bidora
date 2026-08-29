from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):

    email: EmailStr
    password: str


class LoginOTPVerifyRequest(BaseModel):

    email: EmailStr
    otp: str