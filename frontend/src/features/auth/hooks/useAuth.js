// import { useContext, useEffect } from "react";
// import { AuthContext } from "../auth.context";
// import { login, register, logout, getMe } from "../services/auth.api";



// export const useAuth = () => {

//     const context = useContext(AuthContext)
//     const { user, setUser, loading, setLoading } = context


//     const handleLogin = async ({ email, password }) => {
//         setLoading(true)
//         try {
//             const data = await login({ email, password })
//             setUser(data.user)
//         } catch (err) {

//         } finally {
//             setLoading(false)
//         }
//     }

//     const handleRegister = async ({ username, email, password }) => {
//         setLoading(true)
//         try {
//             const data = await register({ username, email, password })
//             setUser(data.user)
//         } catch (err) {

//         } finally {
//             setLoading(false)
//         }
//     }

//     const handleLogout = async () => {
//         setLoading(true)
//         try {
//             const data = await logout()
//             setUser(null)
//         } catch (err) {

//         } finally {
//             setLoading(false)
//         }
//     }

//     useEffect(() => {

//         const getAndSetUser = async () => {
//             try {

//                 const data = await getMe()
//                 setUser(data.user)
//             } catch (err) { } finally {
//                 setLoading(false)
//             }
//         }

//         getAndSetUser()

//     }, [])

//     return { user, loading, handleRegister, handleLogin, handleLogout }
// }
import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        return {
            user: null,
            loading: false,
            handleRegister: async () => {},
            handleLogin: async () => {},
            handleLogout: async () => {},
        };
    }

    const { user, setUser, loading, setLoading } = context;
const handleLogin = async ({ email, password }) => {
    setLoading(true);

    try {
        console.log("Before API Call");

        const data = await login({ email, password });

        console.log("After API Call");
        console.log("DATA =", data);

        if (data?.user) {
            console.log("Setting User =", data.user);
            setUser(data.user);
        }

        return data;
    } catch (err) {
        console.error("Login Error:", err);
        return null;
    } finally {
        setLoading(false);
    }
};
    
    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);

        try {
            const data = await register({ username, email, password });

            if (data?.user) {
                setUser(data.user);
            }

            return data;
        } catch (err) {
            console.error("Register Error:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);

        try {
            await logout();
            setUser(null);
        } catch (err) {
            console.error("Logout Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe();

                if (data?.user) {
                    setUser(data.user);
                }
            } catch (err) {
                console.error("GetMe Error:", err);
            } finally {
                setLoading(false);
            }
        };

        getAndSetUser();
    }, [setUser, setLoading]);

    return {
        user,
        loading,
        handleRegister,
        handleLogin,
        handleLogout,
    };
};