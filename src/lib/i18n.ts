export type Locale = 'pt' | 'en' | 'es'
export const LOCALES: Locale[] = ['pt', 'en', 'es']
export const LOCALE_COOKIE = 'gv_lang'
export const LOCALE_NAMES: Record<Locale, string> = { pt: 'PT', en: 'EN', es: 'ES' }

export interface Dict {
  portalSubtitle: string
  logout: string
  // login
  loginTitle: string
  loginSubtitle: string
  passportLabel: string
  passportPlaceholder: string
  dobLabel: string
  dobHint: string
  loginCta: string
  // dashboard
  hello: string
  processPrefix: string
  statusActive: string
  statusPaused: string
  statusClosed: string
  currentStagePrefix: string
  caseComplete: string
  starting: string
  trackingTitle: string
  nextDeadlineTitle: string
  noDeadline: string
  teamTitle: string
  attorneyTitle: string
  caseManagerTitle: string
  updatesTitle: string
  noUpdates: string
  documentsTitle: string
  noDocuments: string
  messagesTitle: string
  noMessages: string
  messagePlaceholder: string
  sendCta: string
  // deadline relative
  dlToday: string
  dlTomorrow: string
  dlInPrefix: string
  dlDaysSuffix: string
  dlOverdue: string
  // footer
  fWhatsapp: string
  fPhone: string
  fEmail: string
}

export const DICT: Record<Locale, Dict> = {
  pt: {
    portalSubtitle: 'Portal do Cliente',
    logout: 'Sair',
    loginTitle: 'Portal do Cliente',
    loginSubtitle: 'Acompanhe o andamento do seu caso',
    passportLabel: 'Número do passaporte',
    passportPlaceholder: 'Ex.: FN481223',
    dobLabel: 'Data de nascimento',
    dobHint: 'Sua data de nascimento é a sua senha de acesso.',
    loginCta: 'Acessar meu caso',
    hello: 'Olá,',
    processPrefix: 'Processo',
    statusActive: 'Em andamento',
    statusPaused: 'Pausado',
    statusClosed: 'Concluído',
    currentStagePrefix: 'Etapa atual:',
    caseComplete: 'Caso concluído',
    starting: 'Iniciando',
    trackingTitle: 'Acompanhamento do seu caso',
    nextDeadlineTitle: 'Próximo prazo',
    noDeadline: 'Nenhum prazo pendente no momento.',
    teamTitle: 'Equipe responsável',
    attorneyTitle: 'Advogado responsável',
    caseManagerTitle: 'Case Manager responsável',
    updatesTitle: 'Atualizações',
    noUpdates: 'Ainda não há atualizações registradas.',
    documentsTitle: 'Seus documentos',
    noDocuments: 'Nenhum documento disponível ainda.',
    messagesTitle: 'Mensagens com o escritório',
    noMessages: 'Nenhuma mensagem ainda. Escreva a primeira abaixo.',
    messagePlaceholder: 'Escreva uma mensagem…',
    sendCta: 'Enviar',
    dlToday: 'É hoje',
    dlTomorrow: 'Amanhã',
    dlInPrefix: 'Em',
    dlDaysSuffix: 'dias',
    dlOverdue: 'Vencido',
    fWhatsapp: 'WhatsApp',
    fPhone: 'Telefone',
    fEmail: 'E-mail',
  },
  en: {
    portalSubtitle: 'Client Portal',
    logout: 'Sign out',
    loginTitle: 'Client Portal',
    loginSubtitle: 'Follow the progress of your case',
    passportLabel: 'Passport number',
    passportPlaceholder: 'e.g. FN481223',
    dobLabel: 'Date of birth',
    dobHint: 'Your date of birth is your access password.',
    loginCta: 'Access my case',
    hello: 'Hello,',
    processPrefix: 'Case',
    statusActive: 'In progress',
    statusPaused: 'Paused',
    statusClosed: 'Completed',
    currentStagePrefix: 'Current step:',
    caseComplete: 'Case completed',
    starting: 'Starting',
    trackingTitle: 'Tracking your case',
    nextDeadlineTitle: 'Next deadline',
    noDeadline: 'No pending deadlines right now.',
    teamTitle: 'Your legal team',
    attorneyTitle: 'Responsible attorney',
    caseManagerTitle: 'Responsible case manager',
    updatesTitle: 'Updates',
    noUpdates: 'No updates yet.',
    documentsTitle: 'Your documents',
    noDocuments: 'No documents available yet.',
    messagesTitle: 'Messages with the office',
    noMessages: 'No messages yet. Write the first one below.',
    messagePlaceholder: 'Write a message…',
    sendCta: 'Send',
    dlToday: 'Today',
    dlTomorrow: 'Tomorrow',
    dlInPrefix: 'In',
    dlDaysSuffix: 'days',
    dlOverdue: 'Overdue',
    fWhatsapp: 'WhatsApp',
    fPhone: 'Phone',
    fEmail: 'Email',
  },
  es: {
    portalSubtitle: 'Portal del Cliente',
    logout: 'Salir',
    loginTitle: 'Portal del Cliente',
    loginSubtitle: 'Siga el avance de su caso',
    passportLabel: 'Número de pasaporte',
    passportPlaceholder: 'Ej.: FN481223',
    dobLabel: 'Fecha de nacimiento',
    dobHint: 'Su fecha de nacimiento es su contraseña de acceso.',
    loginCta: 'Acceder a mi caso',
    hello: 'Hola,',
    processPrefix: 'Caso',
    statusActive: 'En curso',
    statusPaused: 'Pausado',
    statusClosed: 'Concluido',
    currentStagePrefix: 'Etapa actual:',
    caseComplete: 'Caso concluido',
    starting: 'Iniciando',
    trackingTitle: 'Seguimiento de su caso',
    nextDeadlineTitle: 'Próximo plazo',
    noDeadline: 'Sin plazos pendientes por ahora.',
    teamTitle: 'Su equipo responsable',
    attorneyTitle: 'Abogado responsable',
    caseManagerTitle: 'Case manager responsable',
    updatesTitle: 'Novedades',
    noUpdates: 'Aún no hay novedades.',
    documentsTitle: 'Sus documentos',
    noDocuments: 'Aún no hay documentos disponibles.',
    messagesTitle: 'Mensajes con la oficina',
    noMessages: 'Aún no hay mensajes. Escriba el primero abajo.',
    messagePlaceholder: 'Escriba un mensaje…',
    sendCta: 'Enviar',
    dlToday: 'Es hoy',
    dlTomorrow: 'Mañana',
    dlInPrefix: 'En',
    dlDaysSuffix: 'días',
    dlOverdue: 'Vencido',
    fWhatsapp: 'WhatsApp',
    fPhone: 'Teléfono',
    fEmail: 'Correo',
  },
}

// Localized client milestone labels/descriptions, keyed by milestone key.
export const MILESTONE_I18N: Record<Locale, Record<string, { label: string; description: string }>> = {
  pt: {
    recebido: { label: 'Caso recebido', description: 'Recebemos o seu caso e iniciamos a organização dos documentos.' },
    preparando: { label: 'Preparando seu processo', description: 'Analisamos seu caso e preparamos os formulários e as evidências.' },
    revisao_assinatura: { label: 'Revisão e assinatura', description: 'Coletamos suas assinaturas e revisamos cada detalhe do processo.' },
    enviado: { label: 'Enviado às autoridades', description: 'Seu processo foi enviado ao USCIS/EOIR com envio rastreável.' },
    acompanhamento: { label: 'Acompanhamento', description: 'Acompanhamos recibos, biometria e a decisão sobre o seu caso.' },
  },
  en: {
    recebido: { label: 'Case received', description: 'We received your case and started organizing your documents.' },
    preparando: { label: 'Preparing your case', description: 'We review your case and prepare the forms and evidence.' },
    revisao_assinatura: { label: 'Review & signature', description: 'We collect your signatures and review every detail of the case.' },
    enviado: { label: 'Submitted to authorities', description: 'Your case was submitted to USCIS/EOIR with tracked delivery.' },
    acompanhamento: { label: 'Follow-up', description: 'We follow receipts, biometrics and the decision on your case.' },
  },
  es: {
    recebido: { label: 'Caso recibido', description: 'Recibimos su caso y comenzamos a organizar sus documentos.' },
    preparando: { label: 'Preparando su caso', description: 'Analizamos su caso y preparamos los formularios y las pruebas.' },
    revisao_assinatura: { label: 'Revisión y firma', description: 'Recogemos sus firmas y revisamos cada detalle del caso.' },
    enviado: { label: 'Enviado a las autoridades', description: 'Su caso fue enviado a USCIS/EOIR con envío rastreable.' },
    acompanhamento: { label: 'Seguimiento', description: 'Seguimos recibos, biometría y la decisión sobre su caso.' },
  },
}

// getLocale() lives in server-session.ts (server-only — it needs next/headers).
