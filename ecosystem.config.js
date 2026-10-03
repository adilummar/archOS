module.exports = {
  apps: [
    {
      name: 'archOS',
      script: 'npm',
      args: 'run start -- -p 8081',
      cwd: '/home/adil/archOS',
      env: {
        NODE_ENV: 'production',
        REQUIRE_HTTPS: 'true',
      },
    },
  ],
};

