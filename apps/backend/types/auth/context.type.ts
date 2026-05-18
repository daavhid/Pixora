import { Request, Response } from "express";
import { Session, User } from "../../lib/auth";

export interface TRPCAuthContextType {
    req:Request,
    res:Response,
    user:User,
    session:Session
}