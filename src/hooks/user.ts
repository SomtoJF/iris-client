import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services/auth";

export function useFetchCurrentUser() {
    const queryKey = ["currentUser"];

    const {data, isPending, isFetching, error} = useQuery({ queryKey, queryFn: async () => await getCurrentUser(), refetchInterval: 1000 * 60, refetchOnWindowFocus: true });

    return { user: data, isPending, isFetching, error, queryKey };
}   