module.exports = {
  apps: [{
    name: 'production-crm-backend',
    script: 'dist/main.js',
    cwd: '/var/www/kasuf/data/www/kasuf.xyz/backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5200
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5200
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads']
  }]
};
