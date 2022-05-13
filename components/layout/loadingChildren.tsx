
type LoadingChildrenProps = {
    loading: boolean,
    children: any
}
export default function LoadingChildren({ loading, children }: LoadingChildrenProps) {
    if (loading) {
        return <></>
    }
    return <>{children}</>;
}