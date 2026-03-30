import { test, expect } from '@playwright/test';



//my tests 


test('homepage loads', async ({ page }) => {
  await page.goto('/');
 
})

