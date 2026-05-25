export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/auth-bridge',
          '/change-password',
          '/policies',
          '/procedures',
          '/reports',
          '/risk-assessment',
          '/gap-assessment',
          '/documentation',
          '/compliances',
          '/task-management',
          '/tprm',
          '/dpia',
          '/aiia',
          '/login',
        ],
      },
    ],
    sitemap: 'https://main.d38cbxzpofbmee.amplifyapp.com/sitemap.xml',
  };
}