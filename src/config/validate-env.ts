// Roda no boot, antes de qualquer módulo subir. Em produção, prefere
// falhar imediatamente com uma mensagem clara a subir com um segredo
// default e descobrir o problema só quando algo mais grave acontecer.
export function validateEnv(config: Record<string, unknown>) {
  if (config.NODE_ENV !== 'production') {
    return config;
  }

  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes em produção: ${missing.join(', ')}`,
    );
  }

  const insecureDefaults: Record<string, string> = {
    DB_PASSWORD: 'taskflow',
    JWT_SECRET: 'troque-este-valor-em-producao',
  };
  for (const [key, defaultValue] of Object.entries(insecureDefaults)) {
    if (config[key] === defaultValue) {
      throw new Error(
        `${key} ainda está com o valor padrão de desenvolvimento. Defina um valor seguro antes de subir em produção.`,
      );
    }
  }

  return config;
}
