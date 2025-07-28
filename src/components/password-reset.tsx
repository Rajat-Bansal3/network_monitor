import React from "react";

interface Props {
  resetLink: string;
}

export const PasswordResetEmail = ({ resetLink }: Props) => (
  <div>
    <h1>Password Reset Request</h1>
    <p>
      You requested a password reset for your Network Management System account.
    </p>
    <p>
      <a href={resetLink}>Click here to reset your password</a>
    </p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn&apos;t request this, please ignore this email.</p>
  </div>
);
