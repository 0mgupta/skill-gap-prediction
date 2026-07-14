import { createContext,useState,useEffect } from "react";
import {getMe} from "./services/auth.api";
import { getAdapter } from "axios";


export const AuthContext = createContext()


export const AuthProvider = ({ children }) => { 

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        const getAndSetUser = async () => {
        const data = await getMe()
        setUser(data?.user || null)
        setLoading(false)
        }
         getAndSetUser()
    }, [])


    return (
        <AuthContext.Provider value={{user,setUser,loading,setLoading}} >
            {children}
        </AuthContext.Provider>
    )

    
}