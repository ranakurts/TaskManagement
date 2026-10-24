namespace TaskManagement.Core.Text;

// E-posta ve kullanıcı adlarını karşılaştırma için tek biçime getirir.
// Türkçe "İ" harfi ToLowerInvariant ile küçülmediği için önce "i"ye çevrilir.
public static class TextKey
{
    public static string Normalize(string? value)
    {
        return (value ?? string.Empty).Trim().Replace('İ', 'i').ToLowerInvariant();
    }
}
