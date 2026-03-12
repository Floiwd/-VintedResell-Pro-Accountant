
import React from 'react';
import { Auth as SupabaseAuthUI } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-[22px] text-white font-black text-3xl shadow-2xl shadow-indigo-200 mb-6">
            V
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">ResellPro</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Comptabilité & Stock</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <SupabaseAuthUI 
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4f46e5',
                    brandAccent: '#4338ca',
                    inputBackground: '#f8fafc',
                    inputText: '#0f172a',
                    inputBorder: '#e2e8f0',
                    inputBorderFocus: '#4f46e5',
                    inputBorderHover: '#cbd5e1',
                  },
                  radii: {
                    borderRadiusButton: '16px',
                    buttonBorderRadius: '16px',
                    inputBorderRadius: '16px',
                  },
                  space: {
                    buttonPadding: '14px',
                    inputPadding: '14px',
                  },
                },
              },
              className: {
                button: 'font-black uppercase tracking-widest text-xs transition-all active:scale-95',
                input: 'font-bold text-slate-900 border-2 transition-all',
                label: 'text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1',
                anchor: 'text-indigo-600 font-bold text-xs hover:text-indigo-700',
              }
            }}
            providers={['google']}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email professionnel',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  link_text: 'Déjà un compte ? Connectez-vous',
                },
                sign_up: {
                  email_label: 'Email professionnel',
                  password_label: 'Mot de passe',
                  button_label: 'Créer un compte',
                  link_text: 'Pas encore de compte ? Inscrivez-vous',
                },
              },
            }}
            theme="default"
          />
        </div>

        <p className="text-center mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Propulsé par <span className="text-slate-600">Supabase Security</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
