using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Core.Entities
{
    public class ProductType : BaseEntity
    {
       [Key]
        public int Id { get; set; }
        public string Name { get; set; }
    }
}