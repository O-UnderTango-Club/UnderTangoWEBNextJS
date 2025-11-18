export async function register(userData: {
  name: string;
  surname: string;
  email: string;
  password: string;
}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      }
    );

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
