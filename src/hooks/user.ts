import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services/auth";
import { queryKeys } from "../querykeyfactory";

export function useFetchCurrentUser() {
    const queryKey = queryKeys.user.current;

    const {data, isPending, isFetching, error} = useQuery({ queryKey, queryFn: async () => await getCurrentUser(), refetchInterval: 1000 * 60, refetchOnWindowFocus: true, retry: 1 });

    return { user: data, isPending, isFetching, error, queryKey };
}   