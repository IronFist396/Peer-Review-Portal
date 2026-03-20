//module.exports = {
//  apps: [{
//    name: 'peer-review',
//    script: 'npm',
//    args: 'start',
//    cwd: '/var/www/peer-review-portal',
//    instances: 2,           // Set the exact number of CPU cores
//    exec_mode: 'cluster',   // Enables the load balancer
//    env_file: '.env',
//    env: {
//      NODE_ENV: 'production'
//    }
//  }]
//}

module.exports = {
  apps: [{
    name: 'peer-review',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    cwd: '/var/www/peer-review-portal',
    env_file: '.env',
    env: { NODE_ENV: 'production' }
  }]
}
