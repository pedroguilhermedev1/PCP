const fs = require('fs');
const file = 'app/compras/layout.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { supabase } from '@/lib/supabase';")) {
  code = code.replace("import { getUserRole } from '@/lib/roles';", "import { getUserRole } from '@/lib/roles';\nimport { supabase } from '@/lib/supabase';");
}

const validationBlock = `
      // Validação de Inativação (Polling)
      let interval;
      if (user) {
        const validateUser = async () => {
          if (!supabase) return;
          const { data, error } = await supabase
            .from('usuarios_permissoes')
            .select('ativo')
            .eq('username', user.trim().toLowerCase())
            .single();
            
          if (data && data.ativo === false) {
            console.log('Usuário inativo detectado! Desconectando...');
            localStorage.removeItem('pcp_user');
            localStorage.removeItem('pcp_role');
            localStorage.removeItem('pcp_name');
            localStorage.removeItem('pcp_cd');
            window.location.href = '/login';
          }
        };

        // Verifica na hora
        validateUser();

        // Configura verificação a cada 10 segundos
        interval = setInterval(validateUser, 10000);
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
`;

code = code.replace(/\/\/ Validação de Inativação[\s\S]*?\}\s*\}\s*\}, \[pathname, router\]\);/, validationBlock + '\n  }, [pathname, router]);');

fs.writeFileSync(file, code);
console.log('Fixed layout.tsx');
