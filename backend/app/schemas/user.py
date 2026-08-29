import re

from pydantic import (
    BaseModel,
    EmailStr,
    field_validator,
    model_validator
)


# ==========================================
# REGEX
# ==========================================

# Only letters and spaces
FULLNAME_REGEX = r"^[A-Za-z\s]+$"

# Only letters, @, _, #
USERNAME_REGEX = r"^[A-Za-z@_#]+$"

# Digits only, 1 to 10 digits
MOBILE_REGEX = r"^[6-9]\d{9}$"

# Minimum 6 characters:
# lowercase + uppercase + digit + special character
PASSWORD_REGEX = (
    r"^(?=.*[a-z])"
    r"(?=.*[A-Z])"
    r"(?=.*\d)"
    r"(?=.*[!@#$%^&*(),.?\":{}|<>_\-])"
    r".{6,}$"
)


class UserCreate(BaseModel):

    fullname: str
    username: str
    email: EmailStr
    mobile: str
    password: str
    confirm_password: str
    address: str

    # ==========================================
    # FULL NAME
    # ==========================================

    @field_validator("fullname")
    @classmethod
    def validate_fullname(cls, value: str) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Full name is required."
            )

        if not re.fullmatch(
            FULLNAME_REGEX,
            value
        ):
            raise ValueError(
                "Full name can only contain letters and spaces."
            )

        return value

    # ==========================================
    # USERNAME
    # ==========================================

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Username is required."
            )

        if not re.fullmatch(
            USERNAME_REGEX,
            value
        ):
            raise ValueError(
                "Username can only contain letters, '@', '_' "
                "and '#'. Digits and other special characters "
                "are not allowed."
            )

        return value

    # ==========================================
    # EMAIL
    # ==========================================

    @field_validator("email")
    @classmethod
    def validate_email(
        cls,
        value: EmailStr
    ) -> str:

        return str(value).strip().lower()

    # ==========================================
    # MOBILE
    # ==========================================

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: str) -> str:

        value = value.strip()

        if not value:

            raise ValueError(
                "Mobile number is required."
            )

        if not re.fullmatch(
            MOBILE_REGEX,
            value
        ):

            raise ValueError(
                "Mobile number must be a valid 10-digit number."
            )

        return value

    # ==========================================
    # PASSWORD
    # ==========================================

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:

        if not value:
            raise ValueError(
                "Password is required."
            )

        if not re.fullmatch(
            PASSWORD_REGEX,
            value
        ):
            raise ValueError(
                "Password must be at least 6 characters long "
                "and include at least one lowercase letter, "
                "one uppercase letter, one digit and one "
                "special character."
            )

        return value

    # ==========================================
    # CONFIRM PASSWORD
    # ==========================================

    @field_validator("confirm_password")
    @classmethod
    def validate_confirm_password(
        cls,
        value: str
    ) -> str:

        if not value:
            raise ValueError(
                "Confirm password is required."
            )

        return value

    # ==========================================
    # ADDRESS
    # ==========================================

    @field_validator("address")
    @classmethod
    def validate_address(cls, value: str) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Address is required."
            )

        return value

    # ==========================================
    # PASSWORD MATCH
    # ==========================================

    @model_validator(mode="after")
    def validate_password_match(self):

        if self.password != self.confirm_password:

            raise ValueError(
                "Password and Confirm Password do not match."
            )

        return self