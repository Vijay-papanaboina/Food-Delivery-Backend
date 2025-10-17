Set-Location order-service 
Remove-Item -Recurse -Force ./drizzle
npx drizzle-kit generate
npx drizzle-kit migrate
Set-Location ../payment-service
Remove-Item -Recurse -Force ./drizzle
npx drizzle-kit generate
npx drizzle-kit migrate
Set-Location ../delivery-service
Remove-Item -Recurse -Force ./drizzle
npx drizzle-kit generate
npx drizzle-kit migrate
Set-Location ../restaurant-service
Remove-Item -Recurse -Force ./drizzle
npx drizzle-kit generate
npx drizzle-kit migrate
