using System.Text.Json;
using System.Text.Json.Serialization;

namespace BlazorGantt
{
    public class NumberToStringConverter : JsonConverter<string>
    {
        public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                // 读取数字并转换为字符串
                var number = reader.GetInt32();
                return number.ToString();
            }
            else if (reader.TokenType == JsonTokenType.String)
            {
                // 如果已经是字符串，直接返回
                return reader.GetString();
            }
            else
            {
                throw new JsonException("Unexpected token type.");
            }
        }

        public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            // 将字符串写回为JSON数字（如果需要）
            if (int.TryParse(value, out int number))
            {
                writer.WriteNumberValue(number);
            }
            else
            {
                writer.WriteStringValue(value);
            }
        }
    }
}
