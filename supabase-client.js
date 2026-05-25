// AMDOX ERP // Supabase Database Client Configuration & Fallback Engine
(function (global) {
    // Attempt to load Supabase credentials from LocalStorage or use default sandbox placeholders
    const SUPABASE_URL = localStorage.getItem('AMDOX_SUPABASE_URL') || '';
    const SUPABASE_KEY = localStorage.getItem('AMDOX_SUPABASE_KEY') || '';

    let supabaseInstance = null;
    let isMockMode = true;

    // Check if real credentials are provided and the Supabase library is loaded
    if (SUPABASE_URL && SUPABASE_KEY && global.supabase) {
        try {
            supabaseInstance = global.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            isMockMode = false;
            console.log("AMDOX ERP Connected to Live Supabase Backend Client.");
        } catch (e) {
            console.error("Failed to initialize Supabase client. Running in Sandbox Mock mode.", e);
        }
    } else {
        console.warn("AMDOX ERP: Supabase keys not set. Running in Sandbox Mock mode (with LocalStorage persistence).");
    }

    // --- INITIALIZE LOCAL STORAGE SANDBOX FOR MOCK DATA ---
    const defaultLeads = [
        { id: '1', source: 'Inbound Web', company: 'Hyperion Logistics', estimated_value: 142500.00, status: 'new', partition: 'SEC_ALPHA_01', created_at: new Date().toISOString() },
        { id: '2', source: 'API Partner', company: 'Synthax Systems', estimated_value: 89000.00, status: 'qualified', partition: 'SEC_BETA_04', created_at: new Date().toISOString() },
        { id: '3', source: 'Direct Outreach', company: 'Vanguard Tech', estimated_value: 210000.00, status: 'contacted', partition: 'SEC_ALPHA_09', created_at: new Date().toISOString() }
    ];

    const defaultProjects = [
        { id: '1', name: 'Global Supply Chain Audit', code: 'PROJ_SUPPLY_AUDIT', description: 'Re-align APAC warehouse node compliance indices.', budget: 450000.00, spent: 120000.00, status: 'active', start_date: '2026-04-01', end_date: '2026-08-30' }
    ];

    const defaultLogs = [
        { id: '1', command: 'help', output: 'Help menu initialized.', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', command: 'status', output: 'CPU Load: 34.2%, RAM: 18.4GB', created_at: new Date(Date.now() - 1800000).toISOString() }
    ];

    function initSandboxStore(key, defaults) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(defaults));
        }
    }
    
    initSandboxStore('amdox_leads', defaultLeads);
    initSandboxStore('amdox_projects', defaultProjects);
    initSandboxStore('amdox_terminal_logs', defaultLogs);

    // --- DATABASE API METHODS ---
    const client = {
        isMock: () => isMockMode,
        
        getCredentials: () => ({ url: SUPABASE_URL, key: SUPABASE_KEY }),
        
        setCredentials: (url, key) => {
            localStorage.setItem('AMDOX_SUPABASE_URL', url);
            localStorage.setItem('AMDOX_SUPABASE_KEY', key);
            window.location.reload();
        },

        clearCredentials: () => {
            localStorage.removeItem('AMDOX_SUPABASE_URL');
            localStorage.removeItem('AMDOX_SUPABASE_KEY');
            window.location.reload();
        },

        // --- AUTHENTICATION ---
        getSession: async () => {
            if (!isMockMode) {
                const { data } = await supabaseInstance.auth.getSession();
                return data.session;
            }
            // Mock authentication session
            const userJson = localStorage.getItem('amdox_current_user');
            return userJson ? { user: JSON.parse(userJson) } : null;
        },

        login: async (email, password) => {
            if (!isMockMode) {
                return await supabaseInstance.auth.signInWithPassword({ email, password });
            }
            // Mock log in
            const mockUser = { id: 'u-01', email: email, full_name: 'Executive Director', avatar_url: '' };
            localStorage.setItem('amdox_current_user', JSON.stringify(mockUser));
            return { data: { user: mockUser }, error: null };
        },

        logout: async () => {
            if (!isMockMode) {
                await supabaseInstance.auth.signOut();
                return;
            }
            localStorage.removeItem('amdox_current_user');
        },

        // --- LEADS ---
        getLeads: async () => {
            if (!isMockMode) {
                const { data, error } = await supabaseInstance.from('leads').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            }
            return JSON.parse(localStorage.getItem('amdox_leads'));
        },

        insertLead: async (lead) => {
            if (!isMockMode) {
                const { data, error } = await supabaseInstance.from('leads').insert([lead]).select();
                if (error) throw error;
                return data[0];
            }
            const leads = JSON.parse(localStorage.getItem('amdox_leads'));
            const newLead = { id: uuidv4(), created_at: new Date().toISOString(), ...lead };
            leads.unshift(newLead);
            localStorage.setItem('amdox_leads', JSON.stringify(leads));
            return newLead;
        },

        // --- PROJECTS ---
        getProjects: async () => {
            if (!isMockMode) {
                const { data, error } = await supabaseInstance.from('projects').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            }
            return JSON.parse(localStorage.getItem('amdox_projects'));
        },

        insertProject: async (project) => {
            if (!isMockMode) {
                const { data, error } = await supabaseInstance.from('projects').insert([project]).select();
                if (error) throw error;
                return data[0];
            }
            const projects = JSON.parse(localStorage.getItem('amdox_projects'));
            const newProject = { id: uuidv4(), created_at: new Date().toISOString(), spent: 0, status: 'planning', ...project };
            projects.unshift(newProject);
            localStorage.setItem('amdox_projects', JSON.stringify(projects));
            return newProject;
        },

        // --- TERMINAL LOGS ---
        getTerminalLogs: async () => {
            if (!isMockMode) {
                const { data, error } = await supabaseInstance.from('terminal_logs').select('*').order('created_at', { ascending: false }).limit(20);
                if (error) throw error;
                return data;
            }
            return JSON.parse(localStorage.getItem('amdox_terminal_logs'));
        },

        logTerminalCommand: async (command, output) => {
            if (!isMockMode) {
                const { data, error } = await supabaseInstance.from('terminal_logs').insert([{ command, output }]).select();
                if (error) console.error("Logging command failed:", error);
                return data ? data[0] : null;
            }
            const logs = JSON.parse(localStorage.getItem('amdox_terminal_logs'));
            const newLog = { id: uuidv4(), command, output, created_at: new Date().toISOString() };
            logs.unshift(newLog);
            // Limit local logs storage to 50
            if (logs.length > 50) logs.pop();
            localStorage.setItem('amdox_terminal_logs', JSON.stringify(logs));
            return newLog;
        }
    };

    // Helper unique ID generator for Mock mode
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Attach to global window object
    global.amdoxDb = client;

})(typeof window !== 'undefined' ? window : this);
