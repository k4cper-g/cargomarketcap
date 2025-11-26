import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background text-foreground">
            <div className="space-y-4 text-center">
                <h1 className="text-9xl font-bold text-primary">404</h1>
                <h2 className="text-3xl font-semibold tracking-tight">Page not found</h2>
                <p className="text-muted-foreground max-w-[500px] mx-auto">
                    Sorry, we couldn't find the page you're looking for. It might have been
                    removed, renamed, or doesn't exist.
                </p>
                <div className="pt-6">
                    <Link href="/">
                        <Button size="lg" className="font-semibold">
                            Return to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
