FROM node:16-buster
RUN mkdir /app
COPY package.json /app/
WORKDIR /app
COPY . ./

ENV CLUSTER=curso-basicomongo
ENV MONGO_USER=admin-rafa
ENV MONGO_PWD=yh9xCnyafjXEjlMG
ENV MONGO_DB_NAME=personal-finances
ENV MONGO_CONNECTION=mongodb+srv
ENV JWT_KEY='*6fdgmE+@(MCx4ymq^3(q&)ZRh4NA%'
ENV ONE_TIME_JWT_KEY='zdx#8nn5tf2SNpMJIg7Dq6*F'
ENV PUBLIC_KEY='LAQ6IpFhh4CQGzUm4MnrN(Cu$s$mAj'
ENV MAILER_MAIL='count.on.me.app.personal.finances@gmail.com'
ENV MAILER_PWD='snhyngkfaygigwsg'
ENV SMTP_HOST='smtp.gmail.com'
ENV SMTP_PORT=465
ENV FRONTEND_URI=http://localhost:3000
ENV FRONTEND_PORT=3000

RUN npm install
RUN npm run build
CMD ["npm", "run","start:prod"]