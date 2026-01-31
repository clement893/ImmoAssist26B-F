/**
 * Messages de traduction
 * Fichier centralisé pour les traductions
 */

export const messages = {
  fr: {
    common: {
      welcome: 'Bienvenue',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      create: 'Créer',
      search: 'Rechercher',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
    },
    auth: {
      signIn: 'Se connecter',
      signOut: 'Se déconnecter',
      signUp: "S'inscrire",
      email: 'Email',
      password: 'Mot de passe',
      forgotPassword: 'Mot de passe oublié?',
    },
    navigation: {
      dashboard: 'Tableau de bord',
      users: 'Utilisateurs',
      settings: 'Paramètres',
      profile: 'Profil',
    },
  },
  en: {
    common: {
      welcome: 'Welcome',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    auth: {
      signIn: 'Sign in',
      signOut: 'Sign out',
      signUp: 'Sign up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
    },
    navigation: {
      dashboard: 'Dashboard',
      users: 'Users',
      settings: 'Settings',
      profile: 'Profile',
    },
  },
  es: {
    common: {
      welcome: 'Bienvenido',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      search: 'Buscar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
    },
    auth: {
      signIn: 'Iniciar sesión',
      signOut: 'Cerrar sesión',
      signUp: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
    },
    navigation: {
      dashboard: 'Panel de control',
      users: 'Usuarios',
      settings: 'Configuración',
      profile: 'Perfil',
    },
  },
} as const;

export type Messages = typeof messages;
export type Locale = keyof Messages;
