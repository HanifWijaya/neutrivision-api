const express = require('express'); 
const cors = require('cors');       
const supabase = require('./supabaseClient'); 

const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // Supaya bisa baca inputan form biasa


// ==================== FITUR AUTHENTICATION ====================

app.post('/api/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
  
    // Jika berhasil, simpan nama lengkap ke tabel Profiles
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, full_name: full_name }]);
      if (profileError) console.error("Gagal simpan profil:", profileError.message);
    }
    res.json({ message: "Registrasi berhasil!", user: data.user });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: "Email atau Password Salah" });
  
    // Kirim Token ke Android untuk disimpan di Shared Preferences
    res.json({
      message: "Login Berhasil",
      token: data.session.access_token, // Ini kunci untuk akses fitur lainnya
      user: data.user
    });
});


// ==================== FITUR MENU MAKANAN (ANTI-ERROR) ====================

app.post('/api/menus', async (req, res) => {
    // SAKTI: API akan nyari data di Body, kalau kosong nyari di Query (Params), kalau kosong nyari di Headers!
    const name = req.body.name || req.query.name || req.headers.name;
    const calories = req.body.calories || req.query.calories || req.headers.calories;
    const protein = req.body.protein || req.query.protein || req.headers.protein;
    const carbs = req.body.carbs || req.query.carbs || req.headers.carbs;
    const fat = req.body.fat || req.query.fat || req.headers.fat;

    // Validasi super longgar
    if (!name || calories === undefined) {
        return res.status(400).json({ 
            error: "Nama dan Kalori wajib diisi!",
            Saran: "Pastikan kamu sudah isi 'name' dan 'calories' di Postman kamu."
        });
    }

    const { data, error } = await supabase
        .from('menus')
        .insert([
            { 
                name: String(name), 
                calories: Number(calories), 
                protein: protein ? Number(protein) : 0, 
                carbs: carbs ? Number(carbs) : 0, 
                fat: fat ? Number(fat) : 0 
            }
        ])
        .select();

    if (error) return res.status(500).json({ error: "Gagal ke database: " + error.message });

    res.status(201).json({
        message: "Menu makanan berhasil ditambahkan!",
        menu: data[0]
    });
});

app.get('/api/menus', async (req, res) => {
    const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Berhasil mengambil daftar menu", menus: data });
});

app.get('/api/menus/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('menus').select('*').eq('id', id).maybeSingle(); 
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Menu tidak ditemukan!" });
    res.json({ message: "Berhasil mengambil detail menu", menu: data });
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});