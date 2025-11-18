export async function getPasswordPolicy() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/password-policy`
    );

    return await response.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
