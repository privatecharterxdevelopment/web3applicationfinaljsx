@@ -1,4 +1,5 @@
 import React, { useState, useEffect, useRef } from 'react';
+import { useTranslation } from 'react-i18next';
 import { ChevronDown, Globe } from 'lucide-react';
 
 const languages = [
@@ -12,6 +13,7 @@
 ];
 
 export default function LanguageSelector() {
+  const { i18n } = useTranslation();
   const [isOpen, setIsOpen] = useState(false);
   const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
   const dropdownRef = useRef<HTMLDivElement>(null);
@@ -28,6 +30,7 @@
 
   const handleLanguageSelect = (language: typeof languages[0]) => {
     setSelectedLanguage(language);
+    i18n.changeLanguage(language.code);
     setIsOpen(false);
   };