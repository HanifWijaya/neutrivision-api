const express = require('express'); 
const cors = require('cors');       
const supabase = require('./supabaseClient'); 

const app = express();

app.use(cors()); 
app.use(express.json()); 


app.post('/api/register', async (req, res) => {
    const { email, password, full_name } = req.body;
  
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) return res.status(400).json({ error: error.message });
  
    // 2. Jika berhasil, simpan nama lengkap ke tabel Profiles yang kita buat tadi
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { id: data.user.id, full_name: full_name }
        ]);
  
      if (profileError) console.error("Gagal simpan profil:", profileError.message);
    }
  
    res.json({ message: "Registrasi berhasil!", user: data.user });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) return res.status(401).json({ error: "Email atau Password Salah" });
  
    // Kirim Token ke Android untuk disimpan di Shared Preferences
    res.json({
      message: "Login Berhasil",
      token: data.session.access_token, // Ini kunci untuk akses fitur lainnya
      user: data.user
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});