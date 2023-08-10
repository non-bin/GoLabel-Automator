if ! command -v node &> /dev/null
then
    echo -e "\e[91mNode.js is not installed. Please install Node.js from https://nodejs.org/en/download/\e[0m"
    exit
fi

node src/server.js
