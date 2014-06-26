MAGELOG
=======

Live overview of Magento related logfiles


## Installation


```bash
mkdir magelog
cd magelog
git clone git@github.com:orkz/magelog.git .
npm install
```

## Configuration
Edit config.json. 

## Usage
```bash
node index.js
```

Open http://127.0.0.1:8081


## TODO
- Add support for MySQL backtrace
- Limit number of logs printed to increase performance
- Write parsers for Apache access/error logs
- Option to temporarily disable printing logs for single log file (from front-end)


### Notes
- Intended in development process and not for live servers! 
- Works only on *unix systems - mac, linux
- NodeJS version 0.10.* required. Default Ubuntu packaging tool installs old version of NodeJS. Google how to install latest version.
- MySQL log can be enabled in `/lib/Varien/Db/Adapter/Pdo/Mysql.php`
- Magento system log and exception are disabled by default. It can be enabled in `System -> Configuration -> Developer -> Log Settings`
- If you are using virtualbox, add your public key to authorized keys on virtual machine so it doesn't ask for password each time
- If you are not using virtualbox, remove ssh credentials from config.json




