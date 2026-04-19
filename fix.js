const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/artist/edit-profile/page.tsx', 'utf-8');

content = content.replace(
  'import { auth } from \"@/lib/firebaseService\";\
import { onAuthStateChanged, User as FirebaseUser } from \"firebase/auth\";',
  'import { auth } from \"@/lib/firebaseService\";\nimport { onAuthStateChanged, User as FirebaseUser } from \"firebase/auth\";'
);

content = content.replace(
  'const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);\
  const [authLoading, setAuthLoading] = useState(true);',
  'const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);\n  const [authLoading, setAuthLoading] = useState(true);'
);

fs.writeFileSync('frontend/src/app/artist/edit-profile/page.tsx', content);
