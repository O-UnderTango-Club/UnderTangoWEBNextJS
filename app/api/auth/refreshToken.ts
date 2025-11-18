export async function refreshToken(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/refresh-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      }
    );

    return await response.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
