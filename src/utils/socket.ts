import { io } from "socket.io-client";
import { API_BASE_URL } from "../apis/apiPath";

export const socket = io(API_BASE_URL,{
    autoConnect: false,
})