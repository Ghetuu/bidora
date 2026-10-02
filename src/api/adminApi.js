import axios from "axios";

const adminApi = axios.create({
  baseURL: "http://127.0.0.1:8000",
});


// =========================================================
// ADD TOKEN TO EVERY REQUEST
// =========================================================

adminApi.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem("adminToken");

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;

  },
  (error) => {

    return Promise.reject(error);

  }
);


// =========================================================
// HANDLE UNAUTHORIZED ADMIN SESSION
// =========================================================

adminApi.interceptors.response.use(

  (response) => response,

  (error) => {

    if (
      error.response &&
      error.response.status === 401
    ) {

      localStorage.removeItem(
        "adminToken"
      );

      localStorage.removeItem(
        "adminLoggedIn"
      );

      window.location.href =
        "/admin/login";
    }

    return Promise.reject(error);

  }

);

export default adminApi;