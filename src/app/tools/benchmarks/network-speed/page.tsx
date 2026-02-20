"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function getSpeedTestUrl() {
  // Use a public speed test API or iframe
  return "https://fast.com";
}

export default function NetworkSpeedTest() {
  const [showTest, setShowTest] = useState(false);

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Network Speed Check</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Test your internet download speed using a trusted external service. Click below to start.
        </p>
        {!showTest ? (
          <Button onClick={() => setShowTest(true)} variant="default">
            Start Speed Test
          </Button>
        ) : (
          <div className="w-full h-[400px]">
            <iframe
              src={getSpeedTestUrl()}
              title="Network Speed Test"
              className="w-full h-full border rounded"
              allowFullScreen
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
