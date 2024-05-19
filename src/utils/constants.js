export const USER_ROLES = {
  ADMIN: "Admin",
  CUSTOMER: "Customer",
  EMPLOYEE: "Employee",
};

export const USER_SCHEMA = {
  NAME: "name",
  EMAIL: "email",
  ROLE: "role",
  USERNAME: "username",
  PASSWORD: "password",
  REFRESHTOKEN: "refreshToken",
};

export const USER_ROUTES = {
  REGISTER_USER: "/register-user",
  LOGIN_USER: "/login-user",
  LOGOUT_USER: "/logout",
  REFRESHACCESSTOKEN:"/refreshaccesstoken"
};

export const TOKENNAMES = {
  ACCESSTOKEN: "accesstoken",
  REFRESHTOKEN: "refreshtoken",
};
