FROM node:20-slim

RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*


WORKDIR /home/user/myapp

RUN npx -y create-next-app@14.2.5 . \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --no-git \
    --no-src-dir \
    --import-alias "@/*"


WORKDIR /home/user/myapp

RUN npx shadcn@2.6.3 init -d -b neutral --force && \
    sed -i 's/"style": "new-york"/"style": "default"/' components.json && \
    npx shadcn@latest add accordion alert avatar badge button calendar card checkbox dialog dropdown-menu form input label menubar navigation-menu popover progress radio-group scroll-area select separator sheet skeleton slider switch table tabs textarea toast tooltip

RUN npm install \
    clsx \
    tailwind-merge \
    class-variance-authority \
    tailwindcss-animate \
    lucide-react \
    @radix-ui/react-icons \
    react-hook-form \
    zod \
    @hookform/resolvers \
    zustand \
    @tanstack/react-query \
    framer-motion \
    axios \
    date-fns \
    dayjs \
    uuid \
    nanoid \
    lodash \
    qs \
    sharp \
    next-themes \
    sonner \
    vaul \
    cmdk \
    recharts \
    next-auth \
    @auth/prisma-adapter \
    jsonwebtoken \
    bcryptjs \
    @prisma/client \
    @supabase/supabase-js \
    drizzle-orm \
    uploadthing \
    @uploadthing/react \
    resend \
    @react-email/components

RUN npm install -D \
    @types/jsonwebtoken \
    @types/bcryptjs \
    @types/lodash \
    @types/uuid

RUN npm install

COPY start.sh /home/user/start.sh
RUN chmod +x /home/user/start.sh