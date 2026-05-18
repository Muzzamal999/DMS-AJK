import { useState } from "react";
import type { VerificationResult } from "@/types";
import { applicationApi } from "@/lib/api";

export function useVerification() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const verify = async (certificateNumber: string) => {
    setIsLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await applicationApi.verifyCertificate(certificateNumber.trim());
      if (res.valid) {
        setResult(res as VerificationResult);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setNotFound(false);
  };

  return { result, isLoading, notFound, verify, reset };
}
