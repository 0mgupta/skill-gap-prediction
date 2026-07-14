import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Protected = ({ children }) => {
    const { loading, user } = useAuth();

    console.log("Loading:", loading);
    console.log("User:", user);

    if (loading) {
        return <h1>Loading...</h1>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default Protected;