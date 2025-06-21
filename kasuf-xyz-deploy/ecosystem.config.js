module.exports = {
  apps: [
    {
      name: 'crm-backend',
      script: '/var/upload/backend/dist/main.js',
      cwd: '/var/upload/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5200
      },
      restart_delay: 5000,
      max_restarts: 10,
      error_file: '/var/log/pm2/crm-backend-error.log',
      out_file: '/var/log/pm2/crm-backend-out.log',
      log_file: '/var/log/pm2/crm-backend.log'
    },
    {
      name: 'crm-frontend',
      script: 'serve',
      args: '-s build -l 5201',
      cwd: '/var/upload/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 5201
      },
      restart_delay: 5000,
      max_restarts: 10,
      error_file: '/var/log/pm2/crm-frontend-error.log',
      out_file: '/var/log/pm2/crm-frontend-out.log',
      log_file: '/var/log/pm2/crm-frontend.log'
    }
  ]
};