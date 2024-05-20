export const USER_ROLES = {
  ADMIN: "Admin",
  CUSTOMER: "Customer",
  EMPLOYEE: "Employee",
};

export const VERIFICATION_TOKEN_SCHEMA = {
  USERID: "userId",
  VERIFICATIONTOKEN: "verificationToken",
  EXPIRYDATE: "expiryDate",
};

export const USER_SCHEMA = {
  ID: "_id",
  NAME: "name",
  EMAIL: "email",
  ROLE: "role",
  USERNAME: "username",
  PASSWORD: "password",
  REFRESHTOKEN: "refreshToken",
  ISVERIFIED: "isVerified",
  VERIFICATIONTOKEN: "verificationToken",
};

export const USER_ROUTES = {
  REGISTER_USER: "/register-user",
  LOGIN_USER: "/login-user",
  LOGOUT_USER: "/logout",
  REFRESHACCESSTOKEN: "/refreshaccesstoken",
  VERIFY_USER: "/verify-user/:verificationToken",
};

export const TOKENNAMES = {
  ACCESSTOKEN: "accesstoken",
  REFRESHTOKEN: "refreshtoken",
  VERIFICATIONTOKEN: "verificationtoken",
};
