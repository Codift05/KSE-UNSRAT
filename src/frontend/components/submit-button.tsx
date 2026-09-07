"use client";

import { SignIn } from "@phosphor-icons/react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ idle, pending, icon = false }: { idle: string; pending: string; icon?: boolean }) {
  const { pending: submitting } = useFormStatus();
  return <button type="submit" disabled={submitting} aria-disabled={submitting}>
    {icon && <SignIn size={18} weight="bold" />}{submitting ? pending : idle}
  </button>;
}
