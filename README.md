npm install @capacitor/core @capacitor/cli
npx cap init
npm run build
npm install @capacitor/android
npx cap add android
npx cap sync
git add .
git commit -m "update"
git push