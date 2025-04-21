import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ErrorPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We're sorry, but there was an error loading this content.
          </p>
          <div className="bg-secondary/50 p-3 rounded-md mb-4 overflow-auto max-h-[200px]">
            <code className="text-sm text-foreground">
              {"Error: 404 Not Found"}
            </code>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorPage;
