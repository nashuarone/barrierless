import axios from "axios";

export const axiosInstanse = axios.create({
  baseURL: "https://api.openai.com/v1/",
  withCredentials: true,
});

export const speakAPI = {
    lets() {
      return axiosInstanse
        .get(`/api/users/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => {
          return res;
        })
        .catch((e) => {
          return e.response;
        });
    },
  };
