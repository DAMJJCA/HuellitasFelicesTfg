export function extraerMensajeError(err: any, fallback = 'No se pudo completar la operación.'): string {
  if (err?.status === 0) {
    return 'No se pudo conectar con el backend. Comprueba que Spring Boot está arrancado.';
  }

  if (err?.status === 401) {
    return 'Tu sesión no es válida o ha caducado. Cierra sesión y vuelve a entrar.';
  }

  if (err?.status === 403) {
    return err?.error?.detail ||
      err?.error?.message ||
      'No tienes permisos para ver esta información. Si eres cliente o veterinario, comprueba que tu usuario esté enlazado a su ficha.';
  }

  return err?.error?.detail ||
    err?.error?.message ||
    err?.error?.error ||
    err?.message ||
    fallback;
}
