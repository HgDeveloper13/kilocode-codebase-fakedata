namespace CSharpTestProject.Config;

public record JwtConfig(
    string Secret,
    string Issuer,
    string Audience,
    int ExpiryMinutes = 60
);